import {z} from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
})