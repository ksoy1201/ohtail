// commentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchComments = createAsyncThunk(
  "comments/fetchComments",
  async ({ cocktailId }) => {
    const response = await axios.get(
      `http://localhost:8080/comments?cocktailId=${cocktailId}`
    );
    return response.data.comments;
  }
);

export const submitComment = createAsyncThunk(
  "comments/submitComment",
  async ({ cocktailId, userId, text, type }) => {
    // type 필드를 추가
    const response = await axios.post("http://localhost:8080/comments", {
      cocktailId,
      userId,
      text,
      type,
    }); // type 필드를 포함
    return response.data.comment;
  }
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async ({ commentId }) => {
    await axios.delete(`http://localhost:8080/comments/${commentId}`);
    return commentId;
  }
);

export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ commentId, text }) => {
    const response = await axios.put(
      `http://localhost:8080/comments/${commentId}`,
      { text }
    );
    return response.data.comment;
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    comments: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      .addCase(submitComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter(
          (comment) => comment._id !== action.payload
        );
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (comment) => comment._id === action.payload._id
        );
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      });
  },
});

export default commentsSlice.reducer;
