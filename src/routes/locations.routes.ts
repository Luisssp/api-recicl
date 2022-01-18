import { Router } from "express";
import multer from 'multer'
import { celebrate, Joi } from 'celebrate'
import knex from '../database/connection'
import multerConfig from '../config/multer'
import isAuthenticated from "../middlewares/isAuthenticated";

const locationsRouter = Router()
const upload = multer(multerConfig)

locationsRouter.use(isAuthenticated)

locationsRouter.post('/', celebrate({
    body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        image: Joi.string(),
        whatsapp: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        city: Joi.string().required(),
        uf: Joi.string().required().max(2),
        items: Joi.array().required(),
    })
}, {
    abortEarly: false
}), async (request, response) => {
    const {
        name,
        image,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        items
    } = request.body

    //console.log(request.body)

    const location = {
        image: 'qualquer.jpg',
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf
    }
    const transaction = await knex.transaction()

    const newIds = await transaction('locations').insert(location)

    const location_id = newIds[0]

    const locationItens = items
        .map((item_id: number) => {
            const selectedItem = transaction('items').where('id', item_id).first()
            // console.log(selectedItem)
            if (!selectedItem) {
                return response.status(400).json({ message: 'Item not found' })
            }
            return {
                item_id,
                location_id
            }
        })
    console.log(locationItens)
    await transaction('location_items').insert(locationItens)

    await transaction.commit()

    return response.json({
        id: location_id,
        ...location
    })
})

locationsRouter.get('/:id', async (request, response) => {
    const { id } = request.params

    const location = await knex('locations').where('id', id).first()

    if (!location) {
        return response.status(400).json({ message: 'Location not found' })
    }

    const items = await knex('items')
        .join('location_items', 'items.id', '=', 'location_items.item_id')
        .where('location_items.location_id', id)
        .select('items.title')

    return response.json({ location, items })

})

locationsRouter.get('/', async (request, response) => {
    const { city, uf, items } = request.query

    if (city && uf && items) {

        const parsedItems: Number[] = String(items).split(',').map(item => Number(item.trim()))

        const locations = await knex('locations')
            .join('location_items', 'locations.id', '=', 'location_items.location_id')
            .whereIn('location_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('locations.*')

        return response.json(locations)
    } else {
        const locations = await knex('locations').select('*')

        return response.json(locations)
    }
})

locationsRouter.put('/:id', upload.single('image'), async (request, response) => {
    const { id } = request.params
    const image = request.file?.filename
    const location = await knex('locations').where('id', id).first()
    if (!location) {
        return response.status(400).json({ message: 'Location not found' })
    }
    const locationUpdated = {
        ...location,
        image
    }
    await knex('locations').update(locationUpdated).where('id', id)
    return response.json(locationUpdated)

})

export default locationsRouter