import { describe, expect, it } from 'vitest'
import { updateUsuarioSchema } from '../../schemas/usuario.schema.js'

describe('updateUsuarioSchema', () => {
    it('aceita reset de senha com telefone null', () => {
        const resultado = updateUsuarioSchema.parse({
            nome: 'Funcionario',
            email: 'func@agrofarm.com',
            role: 'FUNCIONARIO',
            fazendaIds: ['550e8400-e29b-41d4-a716-446655440000'],
            telefone: null,
            resetPasswordToDefault: true,
        })

        expect(resultado.resetPasswordToDefault).toBe(true)
        expect(resultado.telefone).toBeNull()
    })

    it('aceita reset de senha sem enviar telefone', () => {
        const resultado = updateUsuarioSchema.parse({
            nome: 'Funcionario',
            email: 'func@agrofarm.com',
            role: 'FUNCIONARIO',
            fazendaIds: ['550e8400-e29b-41d4-a716-446655440000'],
            resetPasswordToDefault: true,
        })

        expect(resultado.resetPasswordToDefault).toBe(true)
        expect(resultado.telefone).toBeUndefined()
    })

    it('aceita telefone vazio como null', () => {
        const resultado = updateUsuarioSchema.parse({
            telefone: '',
        })

        expect(resultado.telefone).toBeNull()
    })
})
