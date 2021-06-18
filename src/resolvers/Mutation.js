import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'
import shortid from 'shortid'
import { createWriteStream } from 'fs'
import { S3 } from 'aws-sdk'

const s3client = new S3({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    params: {
      Bucket: process.env.S3_BUCKET
    }
})

const processUpload = async upload => {
    const { stream, filename, mimetype, encoding } = await upload
    const response = await s3client.upload({
        Key: shortid.generate(),
        ACL: 'public-read',
        Body: stream,
        ContentLength: upload.byteCount,
        ContentType: 'image/jpeg'
    }).promise()
    return response.Location
}

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        if(args.data.name === '') {
            throw new Error('Name is required')
        }
        if(args.data.email === '') {
            throw new Error('Email is required')
        }
        if(args.data.password === '') {
            throw new Error('Password is required')
        }
        if(args.data.phone === '') {
            throw new Error('Phone is required')
        }
        const password = await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password
            }
        })
        return {
            user,
            token: generateToken(user.id)
        }
    },
    async deleteUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        return prisma.mutation.deleteUser({
            where: {
                id: userId
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const formData = {}
        if(args.data.picture && args.data.picture !== '') {
            formData.pictureUrl = await processUpload(args.data.picture)
        } else if (args.data.pictureUrl) {
            formData.pictureUrl = args.data.pictureUrl
        }else {
            formData.pictureUrl = ''
        }
        if(args.data.name === '') {
            throw new Error('Name is required')
        } else {
            formData.name = args.data.name
        }
        if(args.data.email === '') {
            throw new Error('Email is required')
        } else {
            formData.email = args.data.email
        }
        if(args.data.phone === '') {
            throw new Error('Phone is required')
        } else {
            formData.phone = args.data.phone
        }
        if(args.data.address === '') {
            throw new Error('Address is required')
        } else {
            formData.address = args.data.address
        }
        const userId = getUserId(request)
        if (typeof args.data.password === 'string') {
            formData.password = await hashPassword(args.data.password)
        }
        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data: formData
        }, info)
    },
    async login(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })
        if (!user) {
            throw new Error('Incorrect email')
        }
        const isMatch = await bcrypt.compare(args.data.password, user.password)
        if (!isMatch) {
            throw new Error('Incorrect password')
        }
        return {
            user,
            token: generateToken(user.id)
        }
    },
    async createRequest(parent, args, { prisma, request }, info) {
        const userId =  getUserId(request)
        if(args.data.description === '') {
            throw new Error('Description is required')
        }
        if(args.data.items.length === 0) {
            throw new Error('Items are required')
        }
        if(args.data.date === '') {
            throw new Error('Date is required')
        }
        if(args.data.schedule === '') {
            throw new Error('Schedule is required')
        }
        if(args.data.costRange.from === 0 || args.data.costRange.to === 0) {
            throw new Error('Cost Range is required')
        }
        if(args.data.addressDeparture === '') {
            throw new Error('Address Departure is required')
        }
        if(args.data.deliveryAddress === '') {
            throw new Error('Delivery Address is required')
        }
        if(args.data.originPlaceId === '') {
            throw new Error('Origin Place Id is required')
        }
        if(args.data.destinationPlaceId === '') {
            throw new Error('Destination Place Id is required')
        }
        let driver = null
        let status = 'ONHOLD'
        let owner = {
            connect: {
                id: userId
            }
        }
        return prisma.mutation.createRequest({
            data: {
                description: args.data.description,
                items: {
                    create: args.data.items
                },
                date: args.data.date,
                schedule: args.data.schedule,
                costRange: {
                    create: args.data.costRange
                },
                addressDeparture: args.data.addressDeparture,
                deliveryAddress: args.data.deliveryAddress,
                status,
                owner,
                driver,
                originPlaceId: args.data.originPlaceId,
                destinationPlaceId: args.data.destinationPlaceId
            }
        }, info)
    },
    async deleteRequest(parent, args, { prisma, request }, info) {
        const userId =  getUserId(request)
        let driver = null
        let owner = null
        const user = await prisma.query.user({
            where: {
                id: userId
            }
        })
        if(user.role === 'DRIVER') {
            driver = {
                    id: userId
            }
        }else {
            owner = {
                    id: userId
            }
        }
        const requestExists = await prisma.exists.Request({
            id: args.id,
            driver,
            owner
        })
        if (!requestExists) {
            throw new Error('Enable to delete Request')
        }
        return prisma.mutation.deleteRequest({
            where: {
                id: args.id
            }
        }, info)
    },
    async updateRequest(parent, args, { prisma, request }, info) {
        let status
        const userId =  getUserId(request)
        let driver = {
            connect: {
                id: userId
            }
        }
        const requestExists = await prisma.exists.Request({
            id: args.id
        })
        if (!requestExists) {
            throw new Error('Enable to update Request')
        }
        const requests = await prisma.query.requests({
            where: {
                id: args.id
            }
        })
        if(requests[0].status === 'ONHOLD') {
            status = 'ASSIGNED'
        } else if (requests[0].status === 'ASSIGNED') {
            status = 'DELIVERED'
        }
        return prisma.mutation.updateRequest({
            where: {
                id: args.id
            },
            data: {
                ...args.data,
                driver,
                status
            }
        }, info)
    }
}

export { Mutation as default }