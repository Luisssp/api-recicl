import express from 'express'
import cors from 'cors'
import path from 'path'
import { errors } from 'celebrate'
import routes from './routes'

const app = express()

//app.use(cors({
//  origin:['dominio.com.br', 'joseLdeveloper.com.br']    
// }));

app.use(cors()) //qualquer dominio pode acessar

app.use(express.json())

app.use(routes)

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')))

app.use(errors())

app.listen(3333, () => {
    console.log('Server started on port 3333! ')
})

