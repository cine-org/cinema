import { RoleDetail } from './_components/role-detail';
import { RolesList } from './_components/roles-list';
import { getPermissionCatalog, getRoles } from './_data/mock-iam';

export const metadata = { title: 'IAM' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function IAMPage({ searchParams }: Props) {
  const [{ role }, roles, catalog] = await Promise.all([
    searchParams,
    getRoles(),
    getPermissionCatalog(),
  ]);
  const selected = roles.find((r) => r.id === role) ?? roles[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <RolesList roles={roles} selected={selected.id} />
      <RoleDetail role={selected} catalog={catalog} />
    </div>
  );
}
