"use strict";

class Properties
{
    constructor()
    {

    }

    addChild(name, displayName, changeCallback)
    {
        var p = new Properties();
        p.name = name;
        p.displayName = displayName;
        p.changeCallback = changeCallback;
        p.parent = this;
        this[name] = p;
        return p;
    }

    addCategory(name, displayName, changeCallback)
    {
        var p = this.addChild(name, displayName, changeCallback);
        p.displayType = "category";
        return p;
    }

    addBoolean(name, displayName, defaultValue, changeCallback)
    {
        var p = this.addChild(name, displayName, changeCallback);
        p.displayType = "boolean";
        p.value = defaultValue;
        return p;
    }

    addInteger(name, displayName, defaultValue, minValue, maxValue, changeCallback)
    {
        var p = this.addChild(name, displayName, changeCallback);
        p.displayType = "integer";
        p.value = defaultValue;
        p.minValue = minValue;
        p.maxValue = maxValue;
        return p;
    }

    addEnum(name, displayName, enumArray, selectedIndex, changeCallback)
    {
        var p = this.addChild(name, displayName, changeCallback);
        p.displayType = "select";
        p.enumArray = enumArray;
        if (enumArray != null)
        {
            p.value = enumArray[selectedIndex];
        }
        return p;
    }

    addButton(name, displayName, pressCallback)
    {
        var p = this.addChild(name, displayName, pressCallback);
        p.displayType = "button";
        return p;
    }
}

function executeCallbacks(props)
{
    if (props.changeCallback != null)
    {
        props.changeCallback(props);
    }
    if (props.parent != null && props.parent.changeCallback != null)
    {
        props.parent.changeCallback(props);
    }
}

function changeBooleanValue(event)
{
    this.props.value = this.checked;
    executeCallbacks(this.props);
}

function buildBooleanUI(rootElement, props)
{
    var itemDiv = document.createElement("div");
    itemDiv.appendChild(document.createTextNode(props.displayName));

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "booleaninput";
    checkbox.id = props.name;
    checkbox.checked = props.value;
    checkbox.props = props;
    checkbox.onchange = changeBooleanValue;
    itemDiv.appendChild(checkbox);

    rootElement.appendChild(itemDiv);
}

function changeIntegerValueCommon(inputBox)
{
    var intValue = Math.floor(inputBox.value);
    intValue = Math.max(intValue, inputBox.props.minValue);
    intValue = Math.min(intValue, inputBox.props.maxValue);
    inputBox.value = intValue;
    if (intValue != inputBox.props.value)
    {
        inputBox.props.value = intValue;
        executeCallbacks(inputBox.props);
    }
}

function changeIntegerValue(event)
{
    changeIntegerValueCommon(this);
}

function changeIntegerValueWithKey(event)
{
    if (event.key == "Up" || event.key == "Down")
    {
        changeIntegerValueCommon(this);
    }
}

function buildIntegerUI(rootElement, props)
{
    var itemDiv = document.createElement("div");
    itemDiv.appendChild(document.createTextNode(props.displayName));

    var inputBox = document.createElement("input");
    inputBox.type = "number";
    inputBox.className = "numberinput";
    inputBox.id = props.name;
    inputBox.value = props.value;
    inputBox.min = props.minValue;
    inputBox.max = props.maxValue;
    inputBox.step = 1;
    inputBox.props = props;
    inputBox.onchange = changeIntegerValue;
    inputBox.onkeyup = changeIntegerValueWithKey;
    itemDiv.appendChild(inputBox);

    rootElement.appendChild(itemDiv);
}

function changeSelectValue(event)
{
    this.props.value = this.props.enumArray[this.value];
    executeCallbacks(this.props);
}

function buildSelectUI(rootElement, props)
{
    var itemDiv = document.createElement("div");
    itemDiv.appendChild(document.createTextNode(props.displayName));

    var selectDropList = document.createElement("select");
    selectDropList.id = props.name;
    selectDropList.props = props;
    selectDropList.onchange = changeSelectValue;

    if (props.enumArray != null)
    {
        var index = 0;
        for (var enumItem of props.enumArray)
        {
            if (enumItem.displayName != null)
            {
                var option = document.createElement("option");
                option.value = index;
                option.props = enumItem;
                option.appendChild(document.createTextNode(enumItem.displayName));
                if (enumItem == props.value)
                {
                    option.selected = true;
                }
                selectDropList.appendChild(option);
            }
            ++index;
        }
    }

    itemDiv.appendChild(selectDropList);
    rootElement.appendChild(itemDiv);
}

function buildButtonUI(rootElement, props)
{
    var itemDiv = document.createElement("div");

    var button = document.createElement("button");
    button.id = props.name;
    button.props = props;
    button.onclick = props.changeCallback;
    button.appendChild(document.createTextNode(props.displayName));
    itemDiv.appendChild(button);

    rootElement.appendChild(itemDiv);
}

function buildGroupUI(rootElement, props)
{
    var groupDiv = document.createElement("div");
    groupDiv.id = props.name + "Options";

    var titleDiv = document.createElement("div");
    var titleText = props.displayName;
    if (props.isMaze)
    {
        titleText += " Maze Options";
        groupDiv.hidden = true;
        props.groupDiv = groupDiv;
    }
    titleDiv.className = "grouptitle";
    titleDiv.appendChild(document.createTextNode(titleText));
    groupDiv.appendChild(titleDiv);

    rootElement.appendChild(groupDiv);

    for (var prop in props)
    {
        if (props.hasOwnProperty(prop))
        {
            var v = props[prop];
            if (v != null)
            {
                switch (v.displayType) {
                    case "boolean":
                        buildBooleanUI(groupDiv, v);
                        break;
                    case "integer":
                        buildIntegerUI(groupDiv, v);
                        break;
                    case "select":
                        buildSelectUI(groupDiv, v);
                        break;
                    case "button":
                        buildButtonUI(groupDiv, v);
                        break;
                }
            }
        }
    }
}

function buildOptionsUI(rootElement, props)
{
    for (var prop in props)
    {
        if (props.hasOwnProperty(prop))
        {
            var v = props[prop];
            if (v.displayType == "category")
            {
                buildGroupUI(rootElement, v);
            }
        }
    }
}
