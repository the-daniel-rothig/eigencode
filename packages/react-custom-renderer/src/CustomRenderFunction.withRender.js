import CustomRenderFunction from './CustomRenderFunction';
import { traverseDepthFirst } from './reactTraversal';

CustomRenderFunction.prototype.render = function(element) {
  return traverseDepthFirst(
    element,
    this
  );
}

export default CustomRenderFunction;