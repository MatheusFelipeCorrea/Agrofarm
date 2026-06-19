import "../../styles/gerenciamento-usuarios.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteUserModal from "../../components/usuarios/DeleteUserModal.jsx";
import UserFormModal from "../../components/usuarios/UserFormModal.jsx";
import UsuariosTable from "../../components/usuarios/UsuariosTable.jsx";
import { validateUsuarioFormForSubmit } from "../../components/usuarios/userFormValidation.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  useCreateUsuarioMutation,
  useDeleteUsuarioMutation,
  useUpdateUsuarioMutation,
  useUsuarioListQuery,
} from "../../queries/usuario/useUsuarioQueries.js";
import { useFazendaListQuery } from "../../queries/fazenda/useFazendaQueries.js";
import { notify } from "../../lib/notify.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import Button from "../../components/ui/Button/Button.jsx";
import { useAuthStore } from "../../store/authStore.js";
import Input from "../../components/ui/Input/Input.jsx";
import Select from "../../components/ui/Select/Select.jsx";
import { FilterIcon, PlusIcon } from "../../components/ui/icons.jsx";
import { Search } from "lucide-react";

export default function GerenciarUsuarios() {
  const USERS_PER_PAGE = 5;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitial, setFormInitial] = useState(null);
  const [formModalKey, setFormModalKey] = useState(0);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const usuarioLogadoId = useAuthStore((s) => s.usuario?.id);

  const { data: usuarios = [], isLoading, isError, error } = useUsuarioListQuery();
  const { data: fazendasDisponiveis = [] } = useFazendaListQuery();
  const createMutation = useCreateUsuarioMutation();

  useEffect(() => {
    if (!isError || !error) return;
    notify.error(getApiErrorMessage(error, "Não foi possível carregar os usuários."), { id: "usuarios-lista" });
  }, [isError, error]);
  const updateMutation = useUpdateUsuarioMutation();
  const deleteMutation = useDeleteUsuarioMutation();

  const usuariosFiltrados = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const roleMatches = roleFilter === "ALL" || usuario.role === roleFilter;
      if (!roleMatches) return false;

      if (!search) return true;

      const text = [usuario.nome, usuario.email, usuario.telefone, usuario.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }, [usuarios, searchTerm, roleFilter]);

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / USERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (currentPage <= totalPaginas) return;
    setCurrentPage(totalPaginas);
  }, [currentPage, totalPaginas]);

  const usuariosPaginados = useMemo(() => {
    const inicio = (currentPage - 1) * USERS_PER_PAGE;
    return usuariosFiltrados.slice(inicio, inicio + USERS_PER_PAGE);
  }, [usuariosFiltrados, currentPage, USERS_PER_PAGE]);

  const closeFormModal = useCallback(() => {
    setFormOpen(false);
    setFormError("");
  }, []);

  const openCreate = useCallback(() => {
    setFormMode("create");
    setFormInitial(null);
    setFormError("");
    setFormModalKey((k) => k + 1);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((usuario) => {
    setFormMode("edit");
    setFormInitial(usuario);
    setFormError("");
    setFormModalKey((k) => k + 1);
    setFormOpen(true);
  }, []);

  const requestDelete = useCallback((usuario) => {
    setDeleteError("");
    setDeleteTarget(usuario);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError("");
  }, []);

  async function handleSubmitForm(form) {
    setFormError("");
    const result = validateUsuarioFormForSubmit(form, formMode, formInitial?.id);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    try {
      if (result.create) {
        await createMutation.mutateAsync(result.create);
      } else if (result.update) {
        await updateMutation.mutateAsync(result.update);
      }
      closeFormModal();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Não foi possível salvar o usuário."));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleteError("");
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      closeDeleteModal();
    } catch {
      /* Erro da API: toast via React Query. */
    }
  }

  return (
    <MainLayout>
      <UserFormModal
        key={formModalKey}
        open={formOpen}
        mode={formMode}
        initial={formInitial}
        onClose={closeFormModal}
        onSubmit={handleSubmitForm}
        loading={createMutation.isPending || updateMutation.isPending}
        errorMessage={formError}
        fazendasDisponiveis={fazendasDisponiveis}
      />
      <DeleteUserModal
        open={!!deleteTarget}
        nomeUsuario={deleteTarget?.nome}
        errorMessage={deleteError}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />

      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Gerenciar Usuários</h1>
          <p className="text-[0.95rem] text-gray-500">Cadastre, visualize e gerencie os usuários que têm acesso à plataforma.</p>
        </header>

        <div className="flex flex-wrap items-end gap-3">
          <Button
            type="button"
            variant="primaryBrand"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f7f3b] px-5 text-sm font-semibold text-white hover:bg-[#0d6f34] focus-visible:ring-[#0f7f3b]/40"
            onClick={openCreate}
          >
            <PlusIcon className="h-4 w-4" />
            Novo Usuário
          </Button>

          <div className="relative w-full sm:w-[20rem]">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar usuários..."
                wrapperClassName="w-full"
                inputClassName="h-10 rounded-lg border border-gray-200 pr-10"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative w-full sm:w-[11.5rem]">
              <Select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                wrapperClassName="w-full"
                selectClassName="h-10 rounded-lg border border-gray-200 pl-10"
                includeEmptyOption={false}
              >
                <option value="ALL">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="FUNCIONARIO">Funcionário</option>
              </Select>
              <FilterIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <UsuariosTable
          usuarios={usuariosPaginados}
          totalFiltrados={usuariosFiltrados.length}
          isLoading={isLoading}
          onEdit={openEdit}
          onRequestDelete={requestDelete}
          currentUserId={usuarioLogadoId}
          currentPage={currentPage}
          totalPaginas={totalPaginas}
          itensPorPagina={USERS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </MainLayout>
  );
}
