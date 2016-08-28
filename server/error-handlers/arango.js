import ArangoError from 'arangojs/lib/error'

export default function (err, req, res, next) {
  if (err instanceof ArangoError && err.code) {
    res.status(err.code).json({
      error: true,
      isArango: true,
      name: 'DatabaseError',
      message: err.message,
      code: err.code,
      errorNum: err.errorNum
    })
  } else next(err)
}
