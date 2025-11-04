export enum State {
  None,
  InEnum,
  InModel,
  InMultiLineComment,
}

export const STATE_RULES = {
  [State.None]: {
    transitions: {
      enum: State.InEnum,
      model: State.InModel,
    },
  },
  [State.InEnum]: {
    endToken: '}',
    endState: State.None,
  },
  [State.InModel]: {
    endToken: '}',
    endState: State.None,
  },
  [State.InMultiLineComment]: {
    endToken: '*/',
    endState: State.None,
  },
} as const;
