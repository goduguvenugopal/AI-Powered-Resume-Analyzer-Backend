const makeError = (message: string, status: number): Error => {
  const error = new Error(message) as any;
  error.status = status;
  return error;
};

export default makeError;
