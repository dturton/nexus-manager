import { UUID } from '@deepkit/type';

type Plan = {
  id?: UUID;
  taskName: string;
  args: unknown;
};

export default Plan;
