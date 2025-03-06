/**
 * React heatmap component
 */


import * as React from "react";
import styled from "styled-components";
import { HeatMapGrid } from "react-grid-heatmap";
import { Stack, Tooltip, tooltipClasses, Typography } from "@mui/material";
import { format, getISODay, isValid } from "date-fns";
import NoDataPlaceholder from "src/components/no-data-placeholder";
import printDateRange from "src/components/print-daterange";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import { DataTypesNames } from "src/components/template/constants";
import timeSplitter from "src/utils/time-splitter";

const TooltipTitle = styled(Typography)`
    font-size: 16px;
`;

const TooltipContent = styled(Typography)`
    font-size: 0.7rem;
`;

const FocusLabel = styled(Typography)`
    font-size: 11px;
    font-weight: 300;
    align-items: center;
    color: #60d297;
`;

const DateHelper = styled.h2`
    font-size: 11px;
    font-style: normal;
    font-weight: 200;
    opacity: 0.9;
    margin: 3px 0 6px 0;
`;

const LightTooltip = styled(({ className, children, title, ...props }) => (
    <Tooltip {...props} title={title} classes={{ popper: className }}>
        {children}
    </Tooltip>
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.background.tooltip,
        fontSize: 11,
    },
}));

const CellRender = (data, isGrouped, parameters) => (x, y) => {
    const borderVar = parameters.yValues.find((yValue) => yValue.border);
    const hasBorder = borderVar && data[x].perHour[y][borderVar.dataKey] > 0;
    const borderStyle = hasBorder ? borderVar.border : parameters.cellStyle.border;

    const numberOfOverlappingDays = data[x].numberOfOverlappingDays
        ? data[x].numberOfOverlappingDays
        : 1;

    if (!data) return {};

    return (
        <LightTooltip
            title={
                <>
                    {isGrouped ? (
                        <TooltipTitle>
                            {(() => {
                                try {
                                    const dateValue = data[x].perHour[y].datetime;

                                    const dateObject = new Date(dateValue);

                                    if (isValid(dateObject)) {
                                        return format(dateObject, "EEE - HH:mm");
                                    }
                                    return "Invalid Date";
                                } catch (error) {
                                    console.error("Error parsing date:", error);
                                    return "Error";
                                }
                            })()}
                        </TooltipTitle>
                    ) : (
                        <TooltipTitle>
                            {(() => {
                                try {
                                    const dateValue = data[x].perHour[y].datetime;

                                    const dateObject = new Date(dateValue);

                                    if (isValid(dateObject)) {
                                        return format(dateObject, "PP - HH:mm");
                                    }
                                    console.error("Invalid date:", dateValue);
                                    return "Invalid Date";
                                } catch (error) {
                                    console.error("Error parsing date:", error);
                                    return "Error";
                                }
                            })()}
                        </TooltipTitle>
                    )}
                    {isGrouped && <DateHelper>{printDateRange()}</DateHelper>}
                    {hasBorder && (
                        <Stack direction="row" alignItems="center" spacing={0.2}>
                            <CenterFocusStrongIcon
                                style={{ color: "#60d297", height: "14px", width: "14px" }}
                            />
                            <FocusLabel>Set as {borderVar.name}</FocusLabel>
                            <FocusLabel>{data[x].perHour[y][borderVar.dataKey]} times</FocusLabel>
                        </Stack>
                    )}
                    {parameters.yValues.map((yValue) => {
                        if (yValue.border) return null;
                        let value = data[x].perHour[y][yValue.dataKey];
                        if (yValue.aggregationMethod === "avg") {
                            value /= numberOfOverlappingDays;
                        }
                        let valueString = `${value}`;
                        if (yValue.type === DataTypesNames.duration) {
                            valueString = `${timeSplitter(
                                value,
                                "variable-accuracy"
                            )} ${timeSplitter(value, "text")}`;
                        }
                        return (
                            <TooltipContent>
                                {yValue.name}
                                {numberOfOverlappingDays > 1
                                    ? ` (${yValue.aggregationMethod})`
                                    : ""}
                                : {valueString}
                            </TooltipContent>
                        );
                    })}
                </>
            }
        >
            <div
                style={{
                    borderColor: borderStyle.color,
                    borderWidth: borderStyle.width,
                    borderStyle: borderStyle.style,
                    borderRadius: borderStyle.radius,
                    height: borderStyle.height,
                }}
            >
                {x}
            </div>
        </LightTooltip>
    );
};

const TemplateHeatmap = ({ data, parameters }) => {
    if (!data) return <NoDataPlaceholder variant="list" errorMessage={undefined} />;
    // if (toolsScrapping && (toolsScrapping.includes("google") || toolsScrapping.includes("slack")))
    //     return <ScrappingPlaceholder variant="slack" />;
    const isGrouped = data.length > 7;

    const groupedData: {
        [dayOfWeek: string]: {
            perHour: {
                datetime?: string;
                [dataKey: string]: string | number | undefined;
            }[];
        };
    } = {};

    const dayOfWeekCounts: { [dow: number]: number } = {};

    data.forEach((item) => {
        const date = new Date(item.datetime);
        const dayOfWeek = getISODay(date);
        if (!groupedData[dayOfWeek]) {
            groupedData[dayOfWeek] = {
                perHour: [],
            };
        }
        item.perHour.forEach((hour, i) => {
            const perHourItem = { ...groupedData[dayOfWeek].perHour[i] };
            groupedData[dayOfWeek].perHour[i] = {};
            parameters.yValues.forEach((yValue) => {
                if (
                    yValue.type === DataTypesNames.number ||
                    yValue.type === DataTypesNames.duration
                ) {
                    groupedData[dayOfWeek].perHour[i][yValue.dataKey] =
                        (hour[yValue.dataKey] || 0) + (perHourItem[yValue.dataKey] || 0);
                }
                if (yValue.type === DataTypesNames.datetime) {
                    groupedData[dayOfWeek].perHour[i][yValue.dataKey] =
                        perHourItem[yValue.dataKey] || 0;
                }
            });
            parameters.xValues.forEach((xValue) => {
                if (xValue.type === DataTypesNames.number) {
                    groupedData[dayOfWeek].perHour[i][xValue.dataKey] =
                        (hour[xValue.dataKey] || 0) + (perHourItem[xValue.dataKey] || 0);
                }
                if (xValue.type === DataTypesNames.datetime) {
                    groupedData[dayOfWeek].perHour[i][xValue.dataKey] = hour[xValue.dataKey];
                }
            });
        });
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    const result = Object.entries(groupedData).map(([dayOfWeek, item]) => {
        return {
            dayOfWeek: parseInt(dayOfWeek, 10),
            perHour: item.perHour,
            numberOfOverlappingDays: dayOfWeekCounts[dayOfWeek],
        };
    });

    const yLabels = data.map((dataPoint) => {
        const { datetime } = dataPoint.perHour[0];
        const dateObject = new Date(datetime);
        if (isValid(dateObject)) {
            return format(dateObject, "eee");
        }
        return null;
    });

    const yLabelsGrouped = result.map((dataPoint) => {
        const { datetime } = dataPoint.perHour[0];
        const dateObject = new Date(datetime as string);
        if (isValid(dateObject)) {
            return format(dateObject, "eee");
        }
        return null;
    });

    const FormattedData = data.map((dataPoint) => {
        return dataPoint.perHour.map((perHourDataPoint) => {
            return parameters.yValues.reduce((acc, curr) => {
                if (curr.type !== DataTypesNames.number && curr.type !== DataTypesNames.duration)
                    return acc;
                // if (parameters.options.inverse)
                //     return (
                //         acc +
                //         (3600 - ((perHourDataPoint[curr.dataKey] as number) || 0) * curr.multiplier)
                //     );
                return acc + ((perHourDataPoint[curr.dataKey] as number) || 0) * curr.multiplier;
            }, 0);
        });
    });

    const FormattedDataGroup = result.map((dataPoint) => {
        const { numberOfOverlappingDays } = dataPoint;
        return dataPoint.perHour.map((perHourDataPoint) => {
            return parameters.yValues.reduce((acc, curr) => {
                if (curr.type !== DataTypesNames.number && curr.type !== DataTypesNames.duration)
                    return acc;
                // if (parameters.options.inverse)
                //     return (
                //         acc +
                //         (numberOfOverlappingDays * 3600 -
                //             ((perHourDataPoint[curr.dataKey] as number) || 0) * curr.multiplier) /
                //             numberOfOverlappingDays
                //     );
                if (curr.type === DataTypesNames.number)
                    return (
                        acc + ((perHourDataPoint[curr.dataKey] as number) || 0) * curr.multiplier
                    );
                return (
                    acc +
                    (((perHourDataPoint[curr.dataKey] as number) || 0) * curr.multiplier) /
                        numberOfOverlappingDays
                );
            }, 0);
        });
    });

    const renderData = isGrouped ? result : data;

    const getDataGrouping = () => {
        if (isGrouped) return FormattedDataGroup;
        return FormattedData;
    };

    const getLabels = () => {
        if (isGrouped) return yLabelsGrouped;
        return yLabels;
    };

    return (
        <div
            style={{
                width: "95%",
            }}
        >
            <HeatMapGrid
                data={getDataGrouping()}
                yLabels={getLabels()}
                xLabelsPos="bottom"
                cellHeight="1.5rem"
                cellRender={CellRender(renderData, isGrouped, parameters)}
                yLabelsStyle={() => ({
                    fontSize: ".7rem",
                    textTransform: "uppercase",
                    color: "#777",
                })}
                xLabelsStyle={(index) => ({
                    color: index % 2 ? "transparent" : "#777",
                    fontSize: ".7rem",
                })}
                cellStyle={(_x, _y, ratio) => {
                    const {
                        options,
                        cellStyle: { background, fontSize, border, opacity },
                    } = parameters;
                    const { r, g, b } = background;
                    const { color } = border;
                    return {
                        background:
                            !options.inverse && ratio === 0
                                ? `#616161`
                                : `rgb(${r}, ${g}, ${b}, ${
                                      options.inverse ? 1 - ratio : ratio * 2
                                  })`,
                        opacity,
                        fontSize,
                        borderColor: color,
                    };
                }}
            />
        </div>
    );
};

export default TemplateHeatmap;
