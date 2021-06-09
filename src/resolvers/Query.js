import getUserId from '../utils/getUserId'

const Query = {
    users(parent, args, { prisma }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                }]
            }
        }
        return prisma.query.users(opArgs, info)
    },
    me(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        return prisma.query.user({
            where: {
                id: userId
            }
        })
    },
    async myRequests(parent, args, { prisma, request }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy,
            where: {}
        }
        if (args.query) {
            opArgs.where.OR = [{
                    description_contains: args.query
                }]
        }
        const userId = getUserId(request)
        const user = await prisma.query.user({
            where: {
                id: userId
            }
        })
        if(user.role === 'DRIVER') {
            opArgs.where.driver = {
                    id: userId
            }
            opArgs.where.status = 'DELIVERED'
        }else {
            opArgs.where.owner = {
                    id: userId
            }
        }
        return prisma.query.requests(opArgs, info)
    },
    async onHoldRequests(parent, args, { prisma, request }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy,
            where: {}
        }
        if (args.query) {
            opArgs.where.OR = [{
                    description_contains: args.query
                }]
        }
        const userId = getUserId(request)
        opArgs.where.status = 'ONHOLD'
        return prisma.query.requests(opArgs, info)
    },
    async request(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
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
        const requests = await prisma.query.requests({
            where: {
                id: args.id,
                driver,
                owner
            }
        }, info)

        if (requests.length === 0) {
            throw new Error('Request not found')
        }
        return requests[0]
    }

}

export { Query as default }