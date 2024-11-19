import React, { useState } from "react";
import {
  Box,
  Card,
  Chip,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from "@mui/material";
import { format } from "date-fns";
import { useLoaderData } from "react-router-dom";


const API_URL = process.env.REACT_APP_API_URL || "http://api";

// timestamp formatting function
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return format(date, "do MMM yyyy, h:mm a");
};

const itemsPerPage = 5; // Number of items per page


export const fetchGameHistory = async () => {
  try {
    const response = await fetch(API_URL + "/getHistory",
      {
          method: 'GET',
          credentials: 'include'
      }
    );
    const data = await response.json();
    return data.history;
  } catch(err) {
    console.error(err);
    return [];
  }
  
};

export function HistoryPage() {
  const [filter, setFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Descending");
  const [currentPage, setCurrentPage] = useState(1);
  const gameHistory = useLoaderData();

  // Filter and sort logic
  const filteredGames = gameHistory.filter(
    (game) => filter === "All" || game.result === filter
  );

  // Helper function to render the color indicator
  const renderColorBox = (color) => (
    <Box
      sx={{
        width: 12,
        height: 12,
        backgroundColor: color,
        borderRadius: "50%",
        marginRight: 1,
      }}
    />
  );

  const sortedGames = filteredGames.sort((a, b) => {
    const dateA = new Date(a.finishTime);
    const dateB = new Date(b.finishTime);
    return sortOrder === "Ascending" ? dateA - dateB : dateB - dateA;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedGames.length / itemsPerPage);
  const paginatedGames = sortedGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (_, page) => {
    setCurrentPage(page);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 2,
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      {/* Controls for Filter and Sort */}
      <Box
        sx={{
          width: "90%",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        {/* Filter */}
        <FormControl sx={{ width: "48%" }}>
          <InputLabel>Filter by Result</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter by Result"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Win">Win</MenuItem>
            <MenuItem value="Loss">Loss</MenuItem>
            <MenuItem value="Draw">Draw</MenuItem>
          </Select>
        </FormControl>

        {/* Sort */}
        <FormControl sx={{ width: "48%" }}>
          <InputLabel>Sort by Time</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="Sort by Time"
          >
            <MenuItem value="Ascending">Ascending</MenuItem>
            <MenuItem value="Descending">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Game History Cards */}
      {paginatedGames.map((game, index) => (
        <Card
          key={index}
          sx={{
            width: "90%",
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            padding: 2,
            boxShadow: 3,
            backgroundColor: (theme) => theme.palette.background.paper,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          {/* Game Finish Time */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">
              {formatTimestamp(game.finishTime)}
            </Typography>
          </Box>

          {/* Player Info */}
          <Box sx={{ flex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {renderColorBox("white")}
              <Typography variant="subtitle1">{game.playerSide === "White"? game.playerName: game.opponentName}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center"}}>
              {renderColorBox("black")}
              <Typography variant="subtitle1" color="text.secondary">
                {game.playerSide === "Black"? game.playerName: game.opponentName}
              </Typography>
            </Box>
          </Box>

          {/* Game Result */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <Chip
              label={game.result}
              color={
                game.result === "Win"
                  ? "success"
                  : game.result === "Loss"
                  ? "error"
                  : "info"
              }
            />
          </Box>
        </Card>
      ))}

      {/* Pagination */}
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        sx={{ marginTop: 2 }}
      />
    </Box>
  );
};

