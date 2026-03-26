import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PublishCommand } from "@aws-sdk/client-sns";
import { s3Client, sns } from "@@clients/aws.client";
import { UserRepository } from "@@repositories/user/UserRepository";
import type { UserBody, UserResponse, UserUpdateFields } from "@@schemas/user/userSchema";
import { Logger } from "@aws-lambda-powertools/logger";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { BedrockService } from "../ai/BedrockService";
import type { UserService } from "./userService";

const logger = new Logger({ serviceName: "userService" });

const PORTRAITS_BUCKET = process.env.PORTRAITS_BUCKET!;
const VERIFICATION_TOPIC_ARN = process.env.VERIFICATION_TOPIC_ARN!;

export class UserServiceImpl implements UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly bedrockService: BedrockService,
  ) {}

  async create(body: UserBody): Promise<UserResponse> {
    const user = await this.repository.save(body);

    const [enrichment] = await Promise.allSettled([
      this.bedrockService.enrichUserProfile(body.name, body.email),
    ]);

    if (enrichment.status === "fulfilled") {
      await this.repository.update(user.id, enrichment.value);
      return { ...user, ...enrichment.value };
    }

    logger.warn("Bedrock enrichment failed", { userId: user.id, error: enrichment.reason });
    return user;
  }

  async getPortraitUploadUrl(userId: string): Promise<{ uploadUrl: string; portraitKey: string }> {
    await this.repository.getById(userId); // ensure user exists
    const portraitKey = `portraits/${userId}.jpg`;
    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: PORTRAITS_BUCKET, Key: portraitKey }),
      { expiresIn: 300 },
    );
    return { uploadUrl, portraitKey };
  }

  async getById(id: string): Promise<UserResponse> {
    return this.repository.getById(id);
  }

  async list(query?: Record<string, string | undefined>): Promise<UserResponse[]> {
    return this.repository.list(query);
  }

  async update(id: string, body: UserUpdateFields): Promise<UserResponse> {
    return this.repository.update(id, body);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async sendVerificationCode(id: string, email: string): Promise<void> {
    await this.repository.getById(id);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000;
    await this.repository.saveVerificationCode(id, code, expiry);
    await sns.send(
      new PublishCommand({
        TopicArn: VERIFICATION_TOPIC_ARN,
        Message: `Your verification code is: ${code}`,
        Subject: "Email Verification",
        MessageAttributes: {
          email: { DataType: "String", StringValue: email },
        },
      }),
    );
  }

  async verifyCode(id: string, code: string): Promise<void> {
    await this.repository.verifyAndMarkVerified(id, code);
  }
}

export function createUserService(
  repository: UserRepository,
  bedrockService: BedrockService,
): UserService {
  return new UserServiceImpl(repository, bedrockService);
}
