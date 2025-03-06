/**
 * Example React component for an "Teams" page. 
 * Renders a list of teams with filtering, sorting, and search functionality.
 */

import React, { useEffect } from "react";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    FormHelperText,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import styled from "styled-components";
import { useAuth } from "src/components/providers/auth-context";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import fetchStatus from "../../utils/api/fetch-status";
import ShowWithSkeleton from "../../utils/show-with-skeleton";
import { useTeams } from "./teams-provider";
import TeamCardEmpty from "./team-card-empty";
import TeamCard from "./team-card";

const Title = styled.h2`
    font-size: 18px;
`;

const ResponseText = styled(FormHelperText)`
    color: ${({ theme, error }) => (error ? theme.palette.error.main : theme.palette.primary.main)};
`;

const Teams = () => {
    const { user } = useAuth();
    const [teams, setTeams] = React.useState([]);
    const [isFiltered, setIsFiltered] = React.useState(false);
    const [isSortedBy, setIsSortedBy] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleSearchInput = (event) => {
        if (event.target.value === "") {
            setSearchQuery(null);
        } else {
            setSearchQuery(event.target.value);
        }
    };

    const handleSortedChange = (event) => {
        setIsSortedBy(event.target.value);
    };

    const handleFilteredChange = () => {
        setIsFiltered(!isFiltered);
    };

    const teamsApi = useTeams();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let timeout;
        if (location.state) {
            timeout = setTimeout(() => {
                navigate("/teams", { replace: true });
            }, 1000);
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [location && location.state]);

    React.useEffect(() => {
        if (teamsApi.data) {
            let tempTeams = [...teamsApi.data];
            if (isFiltered)
                tempTeams = tempTeams.filter(
                    (team) => team.ownerId === user.id || team.isMember === true
                );
            if (isSortedBy) {
                if (isSortedBy === "isOwner") {
                    tempTeams = tempTeams.sort((a, b) => (a.isOwner < b.isOwner ? 1 : -1));
                }
                if (isSortedBy === "isMember") {
                    tempTeams = tempTeams.sort((a, b) =>
                        a.isMember && !a.isOwner < b.isMember && !b.isOwner ? 1 : -1
                    );
                }
                if (isSortedBy === "isPublic") {
                    tempTeams = tempTeams.sort((team) =>
                        !team.isOwner && !team.isMember && team.isPublic ? -1 : 1
                    );
                }
            }
            if (searchQuery)
                tempTeams = tempTeams.filter((team) =>
                    team.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            setTeams(tempTeams);
        }
    }, [teamsApi.data, isFiltered, isSortedBy, searchQuery]);

    const renderTeams = () => {
        let data;
        if (!teamsApi || teamsApi.status === fetchStatus.PENDING) {
            data = Array(3)
                .fill(0)
                .map((value, id) => ({ id }));
        } else {
            data = teams || [];
        }

        return data.map((team) => (
            <Grid item key={team.id}>
                <ShowWithSkeleton fetchAction={teamsApi}>
                    <TeamCard team={team} />
                </ShowWithSkeleton>
            </Grid>
        ));
    };

    return (
        <>
            <Helmet>
                <title>Adadot - Teams</title>
            </Helmet>
            <Grid container direction="row" spacing={2}>
                <Grid item container alignItems="center" spacing={2}>
                    {location.state && (
                        <Stack
                            justifyContent="center"
                            alignItems="center"
                            style={{ width: "100%" }}
                        >
                            <Paper style={{ width: "auto" }}>
                                <Box p={1}>
                                    <ResponseText color="primary">
                                        Team {location.state.data.name} successfully deleted
                                    </ResponseText>
                                </Box>
                            </Paper>
                        </Stack>
                    )}
                    <Grid item container alignItems="center" spacing={3}>
                        <Grid item>
                            <Title>All Teams</Title>
                        </Grid>
                        <Grid item>
                            <Box sx={{ minWidth: 160 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel
                                        sx={{ fontSize: 12, paddingTop: "3px" }}
                                        id="sort-by-label"
                                    >
                                        Sort By
                                    </InputLabel>
                                    <Select
                                        labelId="sort-by-label"
                                        id="sort-by-select"
                                        value={isSortedBy || ""}
                                        label="Sort By"
                                        onChange={handleSortedChange}
                                    >
                                        <MenuItem value="isOwner">Owner</MenuItem>
                                        <MenuItem value="isMember">Member</MenuItem>
                                        <MenuItem value="isPublic">Can Join</MenuItem>
                                        <Button fullWidth onClick={() => setIsSortedBy(null)}>
                                            reset
                                        </Button>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item>
                            <TextField
                                onChange={handleSearchInput}
                                type="search"
                                id="search-teams"
                                size="small"
                                label={
                                    <Typography sx={{ fontSize: 12, paddingTop: "3px" }}>
                                        Search Teams
                                    </Typography>
                                }
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item>
                            <FormControlLabel
                                control={<Checkbox onChange={handleFilteredChange} />}
                                label={
                                    <Typography sx={{ fontSize: 12 }}>
                                        Teams that include you
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item container spacing={2}>
                    <Grid item>
                        <TeamCardEmpty />
                    </Grid>
                    {renderTeams()}
                </Grid>
            </Grid>
        </>
    );
};

export default Teams;
