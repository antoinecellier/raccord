import moment from 'moment'

export const dataExpiryDate = moment('2017-08-27T23:59:59+02:00')

export default (req, res, next) => {
  const secondsToExpiry = dataExpiryDate.diff(moment(), 'seconds')
  res.set('Cache-Control', `public, max-age=${secondsToExpiry}`)
  return next()
}
