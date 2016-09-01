import joi from 'joi'

export const schema = joi.object().keys({
  from: joi.number().positive().default(0),
  length: joi.number().positive().default(10)
})
