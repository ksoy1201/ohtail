import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLikeStatus, toggleLikeStatus } from "../../store/likeSlice";
import "../../styles/like/LikeButton.css";

const LikeButton = ({ cocktailId, userId, type }) => {
  const dispatch = useDispatch();
  const { liked, likeCount } = useSelector((state) => state.likes);

  useEffect(() => {
    dispatch(fetchLikeStatus({ cocktailId, userId, type }));
  }, [dispatch, cocktailId, userId, type]);

  const handleToggleLike = () => {
    dispatch(toggleLikeStatus({ cocktailId, userId, type, liked: !liked }));
  };

  return (
    <div className="like-button-container">
      <button
        className={`like-button ${liked ? "liked" : ""}`}
        onClick={handleToggleLike}
      >
        {liked ? "좋아요" : "좋아요"}
      </button>
      <span className="like-count">{likeCount}</span>
      {liked && <div className="heart-animation">❤️</div>}
    </div>
  );
};

export default LikeButton;
