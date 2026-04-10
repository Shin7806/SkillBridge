import { useEffect } from "react";
import { redirectUser } from "../../utils/redirectUser";

export default function AuthCallback() {
  useEffect(() => {
    void redirectUser();
  }, []);

  return <div>Signing you in...</div>;
}
