import AuthLayout from "../components/AuthLayout.jsx";
import ChangePasswordForm from "../components/ChangePasswordForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Affiché à la première connexion avec un mot de passe temporaire donné par l'administrateur
export default function ForcePasswordChange() {
  const { user, logout } = useAuth();
  return (
    <AuthLayout
      title="Choisissez votre mot de passe"
      subtitle={`Bonjour ${user?.fullName?.split(" ")[0] || ""}, votre administrateur vous a donné un mot de passe temporaire. Remplacez-le par un mot de passe personnel que vous seul connaissez.`}
      footer={<button onClick={logout} className="font-semibold text-brand hover:text-brand-dark">Se déconnecter</button>}
    >
      <ChangePasswordForm submitLabel="Enregistrer et continuer" />
    </AuthLayout>
  );
}
