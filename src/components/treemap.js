import { treemap, hierarchy, scaleOrdinal, schemeDark2, interpolateRgb, format } from "d3";
import { useEffect } from "react";

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;

    // 减少大长方形的高度
    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom - 10; // 稍微减少高度以确保底部边框显现

    // 构建层次结构
    const root = hierarchy(tree)
        .sum(d => d.children ? 0 : d.value)
        .sort((a, b) => b.value - a.value);

    treemap().size([innerWidth, innerHeight]).padding(1)(root);

    // 调整颜色，使绿色和橙色稍微浅一点，我人眼看着和答案页面颜色更像，哈哈。
    const adjustedSchemeDark2 = schemeDark2.map(color => interpolateRgb(color, "#ffffff")(0.2)); // 颜色变浅 20%
    const color = scaleOrdinal(adjustedSchemeDark2);

    // 检查是否所有属性为 None，我发觉对于答案页面来说，如果都是none，会跳到一个错误页面，显示错误信息，所以我也做了一个。
    const allAttributesNone = !tree.children || tree.children.length === 0;
    useEffect(() => {
        if (allAttributesNone) {
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: white;">
                    <p style="color: black; font-size: 16px; text-align: center;">
                        Application error: a client-side exception has occurred while loading infovis-assignment6-healthdata.vercel.app (see the browser console for more information).
                    </p>
                </div>
            `;
        }
    }, [allAttributesNone]);

    if (allAttributesNone) return null;

    // 这个部分是我写的Legend
    const legendItems = root.leaves().map(d => d.parent?.data)
        .filter((d, i, arr) => d && arr.findIndex(x => x.name === d.name && x.attr === d.attr) === i);

    const legend = legendItems.length > 0 ? (
        <g transform="translate(0, -30)"> {/* 这么写是为了让 legend 永远在那个大长方形的左上角 */}
            {legendItems.map((item, i) => (
                <g key={`legend-${i}`} transform={`translate(${i * 140}, 0)`}>
                    <rect width="12" height="12" fill={color(`${item.attr}:${item.name}`)} />
                    <text x="18" y="10" fontSize="12">{`${item.attr}:${item.name}`}</text>
                </g>
            ))}
        </g>
    ) : null;

    // ----------- 第一层标签和黑色框逻辑 -----------
    const firstLayerLabels = root.children?.map((child, i) => {
        const { x0, y0, x1, y1 } = child;
        const w = x1 - x0;
        const h = y1 - y0;
        const label = child.data?.attr && child.data?.name ? `${child.data.attr}: ${child.data.name}` : "";
        const estimatedLabelLength = label.length * 14;
        const rotate = estimatedLabelLength > w;

        return (
            <g key={`label-${i}`}>
                <rect
                    x={x0}
                    y={y0}
                    width={w}
                    height={h}
                    fill="none"
                    stroke="black"
                    strokeWidth="1"
                />
                <g
                    transform={`translate(${(x0 + x1) / 2}, ${(y0 + y1) / 2})`}
                    style={{ pointerEvents: "none" }}
                >
                    <text
                        transform={rotate ? "rotate(90)" : ""}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize="28"
                        fill="rgba(0, 0, 0, 0.2)"
                        fontWeight="bold"
                    >
                        {label}
                    </text>
                </g>
            </g>
        );
    });

    // 画node
    const nodes = root.leaves().map((node, index) => {
        const { x0, y0, x1, y1 } = node;
        const nodeId = node.ancestors().map(d => d.data.name).reverse().join("/");
        const isSelected = selectedCell === nodeId;

        const colorKey = node.ancestors().length > 1
            ? `${node.ancestors()[1].data.attr}:${node.ancestors()[1].data.name}`
            : "default";

        // 知道最后一层的属性名
        const lastAttrNode = node.ancestors().find(d => d.data.attr);
        const lastAttrName = lastAttrNode ? lastAttrNode.data.attr : "Unknown";

        const label = `${lastAttrName}: ${node.data.name}`;

        return (
            <g
                key={index}
                transform={`translate(${x0},${y0})`}
                onMouseOver={() => setSelectedCell(nodeId)}
                onMouseOut={() => setSelectedCell(null)}
                style={{ cursor: "pointer" }}
            >
                <rect
                    width={x1 - x0}
                    height={y1 - y0}
                    fill={isSelected ? "red" : color(colorKey)}
                    stroke={isSelected ? "black" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                />
                <text
                    x={4} // 左上角
                    y={14} // 左上角
                    textAnchor="start"
                    alignmentBaseline="hanging"
                    fontSize="10"
                    fill="white"
                >
                    {label}
                </text>
                <text
                    x={4} // 左上角
                    y={28} // 左上角
                    textAnchor="start"
                    alignmentBaseline="hanging"
                    fontSize="10"
                    fill="white"
                >
                    Value: {format(".1%")((node.value || 0) / (node.parent?.value || 1))}
                </text>
            </g>
        );
    });

    // 以下画的是黑色框，我看答案页面也有个黑色框，并且黑色框是用于标记第一层的，（像总体的二分法一样），所以我也画了，不完全相同，但我想都能达到一样的目的。
    const blackBoxes = root.children?.slice(0, 2).map((child, i) => {
        const { x0, y0, x1, y1 } = child;
        return (
            <rect
                key={`black-box-${i}`}
                x={x0}
                y={y0}
                width={x1 - x0}
                height={y1 - y0}
                fill="none"
                stroke="black"
                strokeWidth="1"
            />
        );
    });

    return (
        <svg width={svg_width} height={svg_height}>
            <g transform={`translate(${margin.left},${margin.top + 30})`}>
                {legend}
                {blackBoxes}
                {nodes}
                {firstLayerLabels}
            </g>
        </svg>
    );
}

