const sanitizeText = (value = "") =>
  String(value)
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim();

const sanitizePrioritySuggestionInput = (req, _res, next) => {
  req.body.title = sanitizeText(req.body.title);
  req.body.description = sanitizeText(req.body.description);
  next();
};

module.exports = sanitizePrioritySuggestionInput;
