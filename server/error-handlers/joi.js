export default function (err, req, res, next) {
  if (err.isJoi) res.status(400).json(err)
  else next(err)
}
