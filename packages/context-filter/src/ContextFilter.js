import React, { useContext, useRef } from 'react'
import PropTypes from 'prop-types'
import makeUid from 'eigenform/src/util/makeUid';

const propTypes = {
  of: PropTypes.shape({
    Provider: PropTypes.object.isRequired,
    Consumer: PropTypes.object.isRequired,
  }).isRequired,
  to: PropTypes.shape({
    Provider: PropTypes.object.isRequired,
    Consumer: PropTypes.object.isRequired,
  }),
  map: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
}

class ContextFilterInner extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.isInUpdateCascade) {
      return true;
    }
    const equals = nextProps.isUnchanged || ((a,b) => a === b);
    return nextProps.contextType !== this.props.contextType ||
           !equals(this.props.value, nextProps.value);
  }

  render() {
    const Context = this.props.contextType;
    return (
      <Context.Provider value={this.props.value}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

const ContextFilterProbe = ({of: ofContext, to: toContext, map, isUnchanged, children, fingerprint}) => {
  const fingerprintRef = useRef();
  const isInUpdateCascade = fingerprintRef.current !== fingerprint;
  fingerprintRef.current = fingerprint;

  const context = useContext(ofContext)
  const mappedValue = map(context);
  return <ContextFilterInner contextType={toContext || ofContext} value={mappedValue} isUnchanged={isUnchanged} isInUpdateCascade={isInUpdateCascade}>{children}</ContextFilterInner>
}

const ContextFilter = (props) => {
  return <ContextFilterProbe {...props} fingerprint={makeUid()} />;
}

ContextFilter.propTypes = propTypes;

export default ContextFilter;
