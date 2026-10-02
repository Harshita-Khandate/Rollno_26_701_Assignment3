const express = require("express");

const app = express();

app.use(express.static("public"));


// TMDB API
app.get("/movies", async (req, res) => {

    try {

        const response = await fetch(
            "https://api.themoviedb.org/3/movie/popular",
            {
                headers: {
                    Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmY2I1MWMyMTc3NWJjMTEyZDBmNTBiODMwMmJhMGFhMiIsIm5iZiI6MTc5MDk0OTUzNC4wNjQsInN1YiI6IjZhYmZiODllMzZkODc5MzZlYjM5NWYxZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CNTp-HUHqJqIiBfsBdxCIBnS_TEuNlX3fgqbsHDZr0Q"
                }
            }
        );

        const data = await response.json();

        res.json(data);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error fetching movies"
        });

    }

});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});