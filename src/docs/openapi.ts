import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Use different docs for each api
import './user/user.docs';
//import './product.docs'//other docs

export function getOpenApiDocumentation() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Greg test api',
      version: '1.0.0',
    },
    tags: [{ name: 'User', description: 'User ' }],
  });
}
