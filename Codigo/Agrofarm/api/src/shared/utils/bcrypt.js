import bcrypt from 'bcryptjs'

export const hash = async (senha) => {
    return bcrypt.hash(senha, 10)
}

export const compare = async (senha, hash) => {
    return bcrypt.compare(senha, hash)
}