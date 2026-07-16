import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { saveInstallation, getInstallationsByUser, deleteInstallation, getSyncLog } from "./db";

export const syncRouter = router({
  // Salvar instalação (criar ou atualizar)
  saveInstallation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        cliente: z.string(),
        endereco: z.string(),
        bairro: z.string().optional(),
        tipoServico: z.enum(["Instalação", "Tipo 3", "Mudança", "Empresarial"]),
        valor: z.number(),
        data: z.string(),
        observacoes: z.string().optional(),
        isFavorito: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await saveInstallation(ctx.user.id, {
        ...input,
        userId: ctx.user.id,
      });
      return result ? { success: true, data: result } : { success: false, error: "Failed to save installation" };
    }),

  // Obter todas as instalações do usuário
  getInstallations: protectedProcedure.query(async ({ ctx }) => {
    const installations = await getInstallationsByUser(ctx.user.id);
    return { success: true, data: installations };
  }),

  // Deletar instalação
  deleteInstallation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteInstallation(ctx.user.id, input.id);
      return result ? { success: true } : { success: false, error: "Failed to delete installation" };
    }),

  // Obter log de sincronização (para sincronização incremental)
  getSyncLog: protectedProcedure
    .input(z.object({ since: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const log = await getSyncLog(ctx.user.id, input.since);
      return { success: true, data: log };
    }),
});
