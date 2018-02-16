// Converts XML to a keyed array in JavaScript

function XMLtoAssocArray(xml) {
  
  if(typeof xml == "string"){
    xml = XmlService.parse(xml)
  }
  var root = xml.getRootElement()
  var test = XMLhelper(root)
  return test  
}


function XMLhelper(Element){
  var children = Element.getChildren()
  var out = {}
  if(children.length>0){
    for (var ii = 0; ii<children.length; ii++){
      var child = children[ii]
      var name = child.getName();
      if(name in out) {
        var temp = out[name]
        if(typeof temp == "string" || (typeof temp == "object" && !temp.length)){
          out[name] = [temp, XMLhelper(child)]
        }
        else {
          out[name].push(XMLhelper(child))
        }
      }
      else {
        out[name] = XMLhelper(child)
      }
    }
  } else {
    out = Element.getText()
  }
  return out
}

