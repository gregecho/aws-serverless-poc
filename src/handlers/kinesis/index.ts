import { restApiHandler } from "@@middleware/api";
import { createKinesisService } from "@@services/kinesis/kinesisServiceImpl";
import { Errors } from "@@utils/errors";
import { Logger } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";
import { KinesisStreamEvent } from "aws-lambda";
import z from "zod";

const logger = new Logger({ serviceName: "kinesisHandlers" });
const kinesisService = createKinesisService();

export const publishWeatherHandler = restApiHandler({
  query: z.object({ city: z.string().optional() }),
  openapi: {
    method: "post",
    path: "/kinesis/publish",
    summary: "Publish weather to Kinesis",
    tags: ["Kinesis"],
  },
}).handler(async ({ query }) => {
  const city = query?.city;

  let lat = 36.62,
    lon = 117; // default: Jinan
  if (city) {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
    ).then((r) => r.json());
    const result = geo.results?.[0];
    if (!result) throw Errors.NOT_FOUND(`City: ${city}`);
    lat = result.latitude;
    lon = result.longitude;
  }

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
  );
  const weather = await res.json();

  await kinesisService.publish("weather", weather);

  logger.info("weather published", { city: city ?? "Berlin", weather });
  return { published: true };
});

// Cannot use restApiHandler since it's just for restful api
export const weatherConsumerHandler = middy<KinesisStreamEvent>().handler(
  async (event) => {
    for (const record of event.Records) {
      const payload = JSON.parse(
        Buffer.from(record.kinesis.data, "base64").toString("utf-8"),
      );
      logger.info("weather record received", { payload });
    }
  },
);
