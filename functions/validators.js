const yup = require('yup')

const processErrors = err => {
  try {
    let errors = err.inner.map(e=>({[e.path]:e.errors}))
    return {message:err.message, errors}
  } catch {
    console.log('ERROR')
    console.log(e)
    return {message:"Error desconocido"}
  }
}

const VALIDATION_OPTIONS = {
  abortEarly:false,
  stripUnknown:false
}
const rolesShape = yup.array().of(yup.mixed().oneOf([
  'Admin', "Client", "Tesoreria", "Operaciones", "AttCliente"
  ])).min(1).required()
const roles = yup.object().shape({
  roles:rolesShape
})

const user =  yup.object({
  first_name:  yup.string(),
  last_name:  yup.string(),
  displayName:  yup.string(),
  email: yup.string().email().required(),
  password:  yup.string().required(),
  roles:rolesShape
}).transform(form=>{
  console.log(form)
  let {first_name, last_name, displayName,
    ...userData
  } = form
  if(!displayName || displayName ===''){
    displayName = `${first_name} ${last_name}`
  }
  return {displayName, ...userData }
})

const password = yup.object({
  password: yup.string().required().min(6),
  password_conf: yup.string().required().min(6)
}).test('passwordsmatch','Las contraseñas no coinciden',
(form, context) => form.password === form.password_conf)


const formValidationMiddleware = (squema, dataSource, nestedAttr) => (req, res, next) => {
  let data = dataSource ? req.body[dataSource] :  req.body
  if(!data){
    console.log(`Expected ${dataSource} not Found`)
    res.status(401).send({message:"Datos incompletos"})
    return
  }
  if(nestedAttr) data = {[nestedAttr]:data}
  console.log('Data To validate')
  console.log(data)
  squema.validate(data, VALIDATION_OPTIONS)
  .then(valdata=>{
    console.log('Data From Validation:')
    console.log(valdata)
      req.body.validatedData = { ...valdata }
      console.log('req.body.validatedData')
      console.log(req.body.validatedData)
      next()
    })
    .catch(err=>res.status(401).send(processErrors(err)))
}

const rolesMiddleware = formValidationMiddleware(roles, null, 'roles')
const userMiddleware = formValidationMiddleware(user)
const passwordMiddleware = formValidationMiddleware(password)

module.exports = {
  formValidationMiddleware,
  rolesMiddleware,
  userMiddleware,
  passwordMiddleware,
  squemas:{
    roles,
    user
  }
}