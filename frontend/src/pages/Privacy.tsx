import { Link } from "react-router-dom";
import HeroTitle from "../components/ui/Title/MainTitle";
import SectionTitle from "../components/ui/Title/SecondTitle";

const Privacy = () => {
  return (
    <div className="container-custom mt-32">
      <div className="mb-10">
        <HeroTitle line1={<>Politique de confidentialité</>} />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="bg-secondary border border-primary rounded-lg p-6">
          <p className="text-secondary">
            Weeb est un site de démonstration réalisé dans un cadre de
            formation. Vos données ne sont ni vendues, ni louées, ni cédées à un
            tiers, et ne servent à aucune publicité : elles n'existent que pour
            faire fonctionner le site.
          </p>
          <p className="text-muted text-sm mt-4">
            Dernière mise à jour : 25 septembre 2026.
          </p>
        </div>

        <section className="py-8">
          <SectionTitle align="left" line1={<>1. Ce que nous collectons</>} />
          <p className="text-secondary mt-4">
            À la création d'un compte : vos prénom, nom et adresse électronique,
            ainsi qu'un mot de passe, ce dernier n'étant jamais enregistré en
            clair. À l'envoi du formulaire de contact : vos prénom, nom et
            adresse électronique, le sujet et le message. À la publication d'un
            article : son titre, son texte et le compte qui en est l'auteur.
            Nous ne demandons rien d'autre : ni date de naissance, ni téléphone,
            ni adresse postale.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>2. À quoi elles servent</>} />
          <p className="text-secondary mt-4">
            L'adresse électronique identifie votre compte à la connexion et
            reçoit, si vous le demandez, le lien de réinitialisation de votre
            mot de passe ; elle n'est affichée nulle part sur le site. Les
            prénom et nom du compte signent les articles que vous publiez, et
            tout visiteur les voit : c'est le seul endroit où ils paraissent.
            Ceux du formulaire de contact nous servent à vous répondre, avec
            votre message. Ne publiez pas d'article si vous ne souhaitez pas
            rendre votre prénom et votre nom publics.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>3. Ce qui reste sur votre appareil</>} />
          <p className="text-secondary mt-4">
            Le site ne dépose aucun cookie publicitaire et ne mesure pas
            l'audience. Votre navigateur conserve seulement deux choses dans son
            stockage local : les jetons qui maintiennent votre session ouverte,
            effacés à la déconnexion, et votre préférence de thème clair ou
            sombre.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>4. Qui y a accès</>} />
          <p className="text-secondary mt-4">
            Les données restent sur le serveur qui héberge le site et ne sont
            cédées à aucun tiers. L'équipe du projet y accède par l'interface
            d'administration, comptes et articles compris, pour le faire
            fonctionner. Une seule information est publique : le prénom et le
            nom qui signent un article, lisibles par tout visiteur du
            blog. Le courrier électronique de réinitialisation transite par un
            serveur d'envoi, qui ne reçoit que votre adresse et le message
            lui-même.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>5. Combien de temps</>} />
          <p className="text-secondary mt-4">
            Les comptes et les articles sont conservés tant que le compte
            existe. Les messages de contact le sont le temps d'y répondre.
            S'agissant d'un site de démonstration, la base peut être
            réinitialisée à tout moment : ne comptez pas sur lui pour conserver
            quoi que ce soit.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>6. Vos droits</>} />
          <p className="text-secondary mt-4">
            Vous pouvez demander à consulter vos données, à les corriger ou à
            les faire supprimer, compte compris. Écrivez-nous par le{" "}
            <Link
              to="/contact"
              className="text-accent hover:underline focus-ring-primary rounded"
            >
              formulaire de contact
            </Link>{" "}
            : la demande est traitée sans condition. Les règles d'usage du site
            sont décrites dans nos{" "}
            <Link
              to="/terms"
              className="text-accent hover:underline focus-ring-primary rounded"
            >
              conditions d'utilisation
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
