import getUserId from '../utils/getUserId'

const Subscription = {
    myAssignedRequestsAsCustomer: {
        subscribe(parent, args, { prisma, request }, info) {
            const userId = getUserId(request)
            return prisma.subscription.request({
                where: {
                    node: {
                        owner: {
                            id: userId
                        },
                        status: 'ASSIGNED'
                    }
                }
            }, info)
        }
    },
    onHoldRequests: {
        subscribe(parent, args, { prisma, request }, info) {
            return prisma.subscription.request({
                where: {
                    node: {
                        status: 'ONHOLD'
                    }
                }
            }, info)
        }
    }

}

export { Subscription as default }