import Button from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";
import Card from "../components/Blog/Card.tsx";
import ArticleData from "../data/articles.ts";
import { useRef } from "react";
import Input from "../components/ui/Input/Input.tsx";

const Blog = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="container-custom mt-32">
      <MainTitle
        center={false}
        as="h2"
        line1={<>Nos articles vont vous plaire !</>}
      />
      <div className="w-full flex justify-between items-center mt-6">
        <p className="py-6 text-secondary">
          Des articles récents pour vous{" "}
          <span className="text-accent font-bold">inspirer !</span>
        </p>
        <Button
          variant="primary"
          className="ml-4"
          onClick={() => dialogRef.current?.showModal()}
        >
          Crée un articles
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-16">
        {ArticleData.map((article) => (
          <Card key={article.id} article={article} />
        ))}
      </div>

      {/* la modal */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-lg bg-secondary p-6 text-primary backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Nouvel article</h3>
          {/* 4️⃣ Le bouton fermer */}
          <button
            className="text-primary cursor-pointer text-2xl font-bold hover:text-red-800 transition-colors"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Placeholder — le vrai formulaire viendra ici */}
        <div className="flex flex-col items-center justify-center">
          <Input
            label="Titre de l'article"
            placeholder="Entrez le titre de votre article"
            className="w-full mb-4"
            error="Le titre est requis"
          />
          <Input
            label="Contenu de l'article"
            placeholder="Entrez le contenu de votre article"
            className="w-full mb-4"
            error="Le contenu est requis"
          />
          <Input
            label="Auteur de l'article"
            placeholder="Entrez le nom de l'auteur"
            className="w-full mb-4"
            error="Le nom de l'auteur est requis"
          />
          <Button variant="primary">Créer l'article</Button>
        </div>
      </dialog>
    </div>
  );
};

export default Blog;
