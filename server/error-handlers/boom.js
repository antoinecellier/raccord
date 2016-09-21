export default function (err, req, res, next) {
  if (err.isBoom) res.status(err.output.statusCode).json(err.output)
  else next(err)
}
