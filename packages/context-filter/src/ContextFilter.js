import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash/isEqual';

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
  constructor(props) {
    super(props)
  }

  shouldComponentUpdate(nextProps) {
    const equals = nextProps.isUnchanged || isEqual;
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

const ContextFilter = ({of: ofContext, to: toContext, map, isUnchanged, children}) => {
  const context = useContext(ofContext)
  const mappedValue = map(context);
  return <ContextFilterInner contextType={toContext || ofContext} value={mappedValue} isUnchanged={isUnchanged}>{children}</ContextFilterInner>

}

ContextFilter.propTypes = propTypes;

export default ContextFilter;
