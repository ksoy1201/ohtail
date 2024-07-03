import { useNavigate } from "react-router-dom";
import styles from "../../styles/myRecipe/MyRecipeCard.module.css";

const MyRecipeCard = ({ myRecipe }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/myRecipe/${myRecipe._id}`);
  };

  return (
    <li className={styles.card} onClick={handleCardClick}>
      <article>
        {myRecipe.files && myRecipe.files.length > 0 && (
          <figure className={styles.imgCon}>
            <img
              src={`http://localhost:8080/${myRecipe.files[0]}`}
              alt={myRecipe.title}
              className={styles.image}
            />
            <figcaption className={styles.imgText}>
              <h3>{myRecipe.title}</h3>
              <span>@ {myRecipe.authorNickname}</span>
            </figcaption>
          </figure>
        )}
      </article>
    </li>
  );
};

export default MyRecipeCard;
