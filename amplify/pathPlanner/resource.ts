import { defineFunction } from '@aws-amplify/backend';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import type {
  ConstructFactory,
  ResourceProvider,
  FunctionResources,
  ResourceAccessAcceptorFactory,
  StackProvider,
} from '@aws-amplify/plugin-types';

const base = defineFunction();
type PathPlannerInstance = ReturnType<typeof base.getInstance>;

export const pathPlanner: ConstructFactory<PathPlannerInstance> = {
  ...base,
  getInstance: (props) => {
    const instance = base.getInstance(props);
    instance.resources.lambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });
    return instance;
  },
};
