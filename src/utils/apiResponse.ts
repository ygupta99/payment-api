export const errorResponse = (message, statusCode = 400) => {
  
  const response = {
    success: false,
    statusCode,
    data: null,
    message,
  };
  return response;
};

export const successResponse = (data, message, statusCode = 200) => {
  const response = {
    data,
    message,
    statusCode,
    success: true,
  };
  return response;
};
