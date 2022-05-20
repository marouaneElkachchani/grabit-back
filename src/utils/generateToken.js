import jwt from 'jsonwebtoken'

const generateToken = (userId) => {
    return jwt.sign({ userId }, 'my-new-secret-1', { expiresIn: '2 days' })
}

export { generateToken as default }