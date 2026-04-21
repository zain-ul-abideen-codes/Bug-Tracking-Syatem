const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");

const validateObjectId = (paramName = "id") => (req, _res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return next(new ApiError(400, `Invalid ${paramName} supplied.`));
  }

  return next();
};

module.exports = validateObjectId;
