import RolePermissions from "@/components/admin/RolePermissions";

export default function RolesPage() {
  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Permissions des rôles</h1>
          <p className="adm-subtitle">Configurez les permissions accordées à chaque rôle</p>
        </div>
      </div>
      <RolePermissions />
    </div>
  );
}
