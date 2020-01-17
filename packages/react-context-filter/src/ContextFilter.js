import React, { useContext   } from 'react'
import PropTypes from 'prop-types'

const providerPropType = PropTypes.shape({
  Provider: PropTypes.object.isRequired,
  Consumer: PropTypes.object.isRequired,
});

const propTypes = {
  of: PropTypes.oneOfType([
    PropTypes.arrayOf(providerPropType),
    providerPropType
  ]).isRequired,
  to: providerPropType,
  map: PropTypes.func.isRequired,
  isUnchanged: PropTypes.func,
  children: PropTypes.node.isRequired
}

class ContextFilterInner extends React.Component {
  shouldComponentUpdate(nextProps) {
    const touched = nextProps.probe.touched;
    if (!touched) {
      // This is the first time this component updates for
      // the current render cycle of ContextFilterProbe.
      // Since this means that the update is motivated by
      // an update cascade, not a Context update,
      // the component should update in order to propagate
      // the cascade.
      nextProps.probe.touched = true;
      return true;
    }
    const prevValue = this.value;
    const nextValue = nextProps.map(...nextProps.values);
    
    const equals = nextProps.isUnchanged || ((a,b) => a === b);
    return nextProps.contextType !== this.props.contextType ||
           !equals(prevValue, nextValue);
  }

  render() {
    this.props.probe.touched = true;
    const Context = this.props.contextType;
    this.value = this.props.map(...this.props.values);
    return (
      <Context.Provider value={this.value}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

const ContextFilterLayer = ({type, inner, values = []}) => {
  const context = useContext(type);
  return React.cloneElement(inner, {values: [...values, context]});
}

const ContextFilterProbe = ({of: ofContext, to: toContext, map, isUnchanged, children}) => {
  if (!ofContext) {
    throw new Error('ContextFilter requires "of" property');
  }
  if (!toContext && Array.isArray(ofContext)) {
    throw new Error('ContextFilter requires "to" property if "of" property is an Array');
  }

  const probe = { touched: false }

  const contextTypeArray = Array.isArray(ofContext) ? ofContext : [ofContext];

  const inner = <ContextFilterInner contextType={toContext || ofContext} values={[]} isUnchanged={isUnchanged} map={map} probe={probe}>
    {children}
  </ContextFilterInner>

  const element = contextTypeArray.reduceRight( 
    (memo, type) => <ContextFilterLayer type={type} inner={memo} />,
    inner)
  
  return element;
}

const ContextFilter = (props) => {
  return <ContextFilterProbe {...props} />;
}

ContextFilter.propTypes = propTypes;

export default ContextFilter;
