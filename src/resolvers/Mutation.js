import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
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
        const userId = getUserId(request)

        if (typeof args.data.password === 'string') {
            args.data.password = await hashPassword(args.data.password)
        }

        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data: args.data
        }, info)
    },
    async login(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })

        if (!user) {
            throw new Error('Unable to login')
        }

        const isMatch = await bcrypt.compare(args.data.password, user.password)

        if (!isMatch) {
            throw new Error('Unable to login')
        }

        return {
            user,
            token: generateToken(user.id)
        }
    },
    async createRequest(parent, args, { prisma, request }, info) {
        const userId =  getUserId(request)
        let driver = null
        let owner = null
        let status = null
        const user = await prisma.query.user({
            where: {
                id: userId
            }
        })
        if(user.role === 'DRIVER') {
            driver = {
                connect: {
                    id: userId
                }
            }
            status = 'ASSIGNED'
        }else {
            owner = {
                connect: {
                    id: userId
                }
            }
            status = 'ONHOLD'
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
                deliveryAddress: args.data.deliveryAddress,
                status,
                owner,
                driver
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
            throw new Error('Enable to update Request')
        }
        return prisma.mutation.updateRequest({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    }
}

export { Mutation as default }