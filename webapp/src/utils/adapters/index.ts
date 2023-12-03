type TypeID = string;

export type MessageData = {
  defaultMessage: string;
  id: string;
  params: {
    name: string;
    types: TypeID[];
  }[];
};