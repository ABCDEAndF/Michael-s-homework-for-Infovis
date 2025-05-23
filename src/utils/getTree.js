export function getTree(data, attrs) {
    const getLevels = (attr) => {
        const attrArray = data.map(d => d[attr]);
        const levels = attrArray.filter((d, idx) => attrArray.indexOf(d) === idx).sort();
        return levels.map(d => ({
            "name": String(d).replace(/"/g, '"'), // 转义双引号
            "attr": attr
        }));
    };
    const levels = attrs.map(d => getLevels(d));
    const getJsonTree = function(data, levels) {
        let itemArr = [];
        if (levels.length === 0) {
            return null;
        }
        const currentLevel = levels[0];
        for (let i = 0; i < currentLevel.length; i++) {
            let node = currentLevel[i];
            let newData = data.filter(d => d[currentLevel[0].attr] === currentLevel[i].name);
            if (newData.length > 0) {
                let newNode = {};
                newNode.points = newData;
                newNode.name = node.name;
                newNode.attr = node.attr;
                newNode.value = newData.length; // number of patients
                let children = getJsonTree(newData, levels.slice(1));
                if (children) {
                    newNode.children = children;
                }
                itemArr.push(newNode);
            }
        }
        return itemArr;
    };
    return getJsonTree(data, levels);
}