import { defineFunction } from '@aws-amplify/backend';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import type { ConstructFactory } from '@aws-amplify/plugin-types';

const base = defineFunction();
type PathPlannerInstance = ReturnType<typeof base.getInstance>;

export const pathPlanner: ConstructFactory<PathPlannerInstance> = {
  ...base,
  getInstance: (props) => {
    const instance = base.getInstance(props);
    const fnUrl = instance.resources.lambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.OPTIONS],
        allowedHeaders: ['*'],
      },
    });
    props.outputStorageStrategy.addBackendOutputEntry('pathPlanner', {
      version: '1',
      payload: { functionUrl: fnUrl.url },
    });
    return instance;
  },
};
