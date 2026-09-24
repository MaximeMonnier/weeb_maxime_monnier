import { Link } from "react-router-dom";
import HeroTitle from "../components/ui/Title/MainTitle";
import SectionTitle from "../components/ui/Title/SecondTitle";

const Terms = () => {
  return (
    <div className="container-custom mt-32">
      <div className="mb-10">
        <HeroTitle line1={<>Conditions d'utilisation</>} />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="bg-secondary border border-primary rounded-lg p-6">
          <p className="text-secondary">
            Weeb est un site de démonstration réalisé dans un cadre de
            formation. Il ne vend rien, ne propose aucun service payant et
            n'exploite commercialement aucune donnée. Les présentes conditions
            décrivent ce que vous pouvez en attendre, et ce que nous attendons
            de vous.
          </p>
          <p className="text-muted text-sm mt-4">
            Dernière mise à jour : 24 septembre 2026.
          </p>
        </div>

        <section className="py-8">
          <SectionTitle align="left" line1={<>1. Objet du site</>} />
          <p className="text-secondary mt-4">
            Weeb est un blog consacré au développement web. Il permet de lire
            des articles, d'écrire à l'équipe et, pour les personnes inscrites,
            de publier les leurs. L'accès est gratuit et le restera : aucune
            fonctionnalité n'est réservée à un abonnement.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>2. Compte et accès</>} />
          <p className="text-secondary mt-4">
            La création d'un compte demande vos prénom, nom et adresse
            électronique, ainsi qu'un mot de passe. Le compte naît inactif :
            un administrateur doit l'ouvrir avant votre première connexion.
            Vous êtes ensuite responsable de la confidentialité de ce mot de
            passe et des publications faites depuis votre compte. Le site étant
            une démonstration, n'y déposez aucune information sensible et
            choisissez un mot de passe que vous n'utilisez nulle part ailleurs.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>3. Contenus publiés</>} />
          <p className="text-secondary mt-4">
            Vous restez propriétaire des textes que vous publiez : personne
            d'autre que vous ne peut les modifier, et l'équipe du projet peut
            les retirer depuis son interface d'administration. Le site n'offre
            pas encore d'écran de modification ni de suppression : demandez-les
            par le formulaire de contact. Un article publié porte l'adresse
            électronique de son auteur, à la vue de tous. En publiant, vous
            garantissez que vos textes sont les vôtres et qu'ils ne portent
            atteinte à personne.
            Tout contenu illicite, injurieux ou contraire au droit d'auteur peut
            être retiré sans préavis.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>4. Propriété intellectuelle</>} />
          <p className="text-secondary mt-4">
            Le nom, les visuels et le code du site servent un projet
            pédagogique. Les images et les textes d'exemple ne sont pas libres
            de droits par défaut : ne les réutilisez pas sans vous être assuré
            de leur licence.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>5. Disponibilité</>} />
          <p className="text-secondary mt-4">
            Le site peut être interrompu, réinitialisé ou fermé à tout moment,
            sans avertissement et sans conservation des données saisies. Il
            n'est assorti d'aucune garantie de fonctionnement et sa
            responsabilité ne peut être engagée en cas de perte de contenu.
          </p>
        </section>

        <section className="py-8">
          <SectionTitle align="left" line1={<>6. Évolution et contact</>} />
          <p className="text-secondary mt-4">
            Ces conditions peuvent changer au fil du projet ; la date de mise à
            jour ci-dessus fait foi. Pour toute question, écrivez-nous par le{" "}
            <Link
              to="/contact"
              className="text-accent hover:underline focus-ring-primary rounded"
            >
              formulaire de contact
            </Link>
            . Le traitement de vos données est détaillé dans notre{" "}
            <Link
              to="/privacy"
              className="text-accent hover:underline focus-ring-primary rounded"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
