import { GitHub } from "@actions/github/lib/utils";

export interface IClient extends InstanceType<typeof GitHub> {}

export interface ISubject {
  glob: string;
  asOfDate: string;
  dueDate: string;
}

export interface IConfigObject {
  target: {
    team_slug: string;
  };
  subjects: {
    [key: string]: ISubject;
  };
}
